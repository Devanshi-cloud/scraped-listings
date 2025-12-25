"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Search, MapPin, Home, ExternalLink, Filter, AlertCircle } from "lucide-react"

interface Property {
  _id: string
  title: string
  location: string
  price: string
  priceSqft: string
  photoUrl: string
  listingUrl: string
  amenities: string[]
  latitude: number
  longitude: number
  address: string
  category: string
  tags: string[]
  projectHighlights: string
  reraId: string
}

const PropertyListings = () => {
  const [properties, setProperties] = useState<Property[]>([])
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [tagFilter, setTagFilter] = useState("all")
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchProperties()
  }, [])

  useEffect(() => {
    filterProperties()
  }, [searchTerm, categoryFilter, tagFilter, properties])

  const fetchProperties = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/properties", {
        method: "GET",
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch data: ${response.status} - ${errorText}`)
      }

      const data = await response.json()

      if (!data.documents) {
        throw new Error("No documents found in response")
      }

      const processedData: Property[] = data.documents.map((doc: any) => ({
        _id: doc._id?.$oid || doc._id,
        title: doc.title || "Unknown",
        location: doc.taxonomies?.["at_biz_dir-location"]?.[0] || "Unknown",
        price: doc.fields?.starting_bsp || "N/A",
        priceSqft: doc.fields?.price_sqft || "N/A",
        photoUrl: doc.fields?.photo_url || "",
        listingUrl: doc.fields?.listing_url || "#",
        amenities: doc.fields?.amenities || [],
        latitude: doc.fields?.latitude ? parseFloat(doc.fields.latitude) : 0,
        longitude: doc.fields?.longitude ? parseFloat(doc.fields.longitude) : 0,
        address: doc.fields?.address || "N/A",
        category: doc.taxonomies?.["at_biz_dir-category"]?.[0] || "Unknown",
        tags: doc.taxonomies?.["at_biz_dir-tags"] || [],
        projectHighlights: doc.fields?.project_highlights || "N/A",
        reraId: doc.fields?.rera_id || "N/A",
      }))

      setProperties(processedData)
      setFilteredProperties(processedData)
      setLoading(false)
    } catch (err) {
      console.error("Error fetching properties:", err)
      setError(err instanceof Error ? err.message : "Unknown error occurred")
      setLoading(false)
    }
  }

  const filterProperties = () => {
    const filtered = properties.filter((property) => {
      const matchesSearch =
        property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.address.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCategory = categoryFilter === "all" || property.category === categoryFilter

      const matchesTag = tagFilter === "all" || property.tags.includes(tagFilter)

      return matchesSearch && matchesCategory && matchesTag
    })

    setFilteredProperties(filtered)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading properties...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <AlertCircle className="w-8 h-8" />
            <h2 className="text-2xl font-bold">Connection Error</h2>
          </div>
          <p className="text-gray-700 mb-4">Failed to load properties: {error}</p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800 font-medium mb-2">Troubleshooting steps:</p>
            <ol className="text-sm text-yellow-800 space-y-2 list-decimal list-inside">
              <li>Verify MongoDB Data API is enabled in Atlas</li>
              <li>Check that API key is set in environment variables</li>
              <li>Ensure the database and collection names match</li>
              <li>Check browser console for detailed error messages</li>
            </ol>
          </div>
          <button
            onClick={fetchProperties}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Home className="w-8 h-8 text-indigo-600" />
              <h1 className="text-3xl font-bold text-gray-800">Property Listings</h1>
            </div>
            <div className="text-sm text-gray-600">{filteredProperties.length} properties found</div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <select
                    value={tagFilter}
                    onChange={(e) => setTagFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All Tags</option>
                    <option value="Premium">Premium</option>
                    <option value="Verified">Verified</option>
                    <option value="New Launch">New Launch</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {filteredProperties.length === 0 ? (
          <div className="text-center py-16">
            <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No properties found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <div
                key={property._id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative h-48 bg-gray-200">
                  <img
                    src={property.photoUrl || "/placeholder.svg"}
                    alt={property.title}
                    className="w-full h-full object-cover"
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      e.currentTarget.src = "https://via.placeholder.com/400x300?text=Property+Image"
                    }}
                  />
                  <div className="absolute top-3 right-3 bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {property.category}
                  </div>
                  {property.tags.length > 0 && (
                    <div className="absolute top-3 left-3 flex gap-2">
                      {property.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">{property.title}</h3>

                  <div className="flex items-center text-gray-600 mb-3">
                    <MapPin className="w-4 h-4 mr-1 shrink-0" />
                    <span className="text-sm">{property.location}</span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Price</span>
                      <span className="font-semibold text-indigo-600">{property.price}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Per Sqft</span>
                      <span className="font-semibold">{property.priceSqft}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">RERA ID</span>
                      <span className="font-semibold text-xs">{property.reraId}</span>
                    </div>
                  </div>

                  {property.projectHighlights !== "N/A" && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-600 font-medium mb-1">Highlights:</p>
                      <p className="text-sm text-gray-700">{property.projectHighlights}</p>
                    </div>
                  )}

                  {property.amenities.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-600 font-medium mb-2">Amenities:</p>
                      <div className="flex flex-wrap gap-1">
                        {property.amenities.slice(0, 4).map((amenity, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            {amenity}
                          </span>
                        ))}
                        {property.amenities.length > 4 && (
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded font-medium">
                            +{property.amenities.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <a
                    href={property.listingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  >
                    View Details
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="bg-white mt-16 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-600">
          <p className="text-sm">Property data from MongoDB • Real-time updates</p>
        </div>
      </footer>
    </div>
  )
}

export default PropertyListings