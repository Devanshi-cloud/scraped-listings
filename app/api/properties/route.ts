import { MongoClient } from "mongodb"
import { type NextRequest, NextResponse } from "next/server"

const uri = process.env.MONGODB_URI

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

    const db = client.db("ccube_research")
    const collection = db.collection("apartment")

    const properties = await collection.find({}).limit(500).toArray()

    return NextResponse.json({ documents: properties })
  } catch (error) {
    console.error("Error fetching properties:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch properties" },
      { status: 500 },
    )
  }
}
