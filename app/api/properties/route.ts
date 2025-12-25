import { MongoClient } from "mongodb"
import { type NextRequest, NextResponse } from "next/server"

const uri = process.env.MONGODB_URI + "&ssl=false";

let cachedClient: MongoClient | null = null

async function getMongoClient() {
  if (cachedClient) {
    return cachedClient
  }

  if (!uri) {
    throw new Error("MONGODB_URI environment variable not configured")
  }

  const client = new MongoClient(uri)
  cachedClient = client
  return client
}

export async function GET(request: NextRequest) {
  try {
    const client = await getMongoClient()
    await client.connect()

    const db = client.db("proptrust")
    const collection = db.collection("listings")

    const properties = await collection.find({}).limit(500).toArray()

    const formattedProperties = properties.map((property) => ({
      _id: {
        $oid: property._id.toHexString(), // Convert ObjectId to string for $oid
      },
      title: property.title,
      author_id: property.author_id,
      meta_description: property.meta_description,
      project_description: property.project_description,
      fields: {
        price_sqft: property.price_sqft,
        latitude: property.latitude,
        longitude: property.longitude,
        address: property.address,
        project_highlights: property.project_highlights,
        rera_url: property.rera_url,
        rera_id: property.rera_id,
        about_project: property.about_project,
        nearest_school: property.nearest_school,
        nearest_bank: property.nearest_bank,
        nearest_hospital: property.nearest_hospital,
        starting_bsp: property.starting_bsp,
        project_detail: property.project_detail,
        listing_url: property.listing_url,
        photo_url: property.photo_url,
        amenities: property.amenities || [], // Ensure amenities is an array
      },
      taxonomies: {
        "at_biz_dir-category": property["at_biz_dir-category"] || [],
        "at_biz_dir-location": property["at_biz_dir-location"] || [],
        "at_biz_dir-tags": property["at_biz_dir-tags"] || [],
      },
      scraped_at: property.scraped_at,
    }))

    return NextResponse.json({ documents: formattedProperties })
  } catch (error) {
    console.error("Error fetching properties:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch properties" },
      { status: 500 },
    )
  }
}