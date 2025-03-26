import Link from "next/link"
import { Laptop, Shirt, Watch, Camera, Home, Gift } from "lucide-react"

const categories = [
  {
    name: "Electronics",
    icon: Laptop,
    href: "/category/electronics",
    color: "bg-blue-100 text-blue-600",
  },
  {
    name: "Fashion",
    icon: Shirt,
    href: "/category/fashion",
    color: "bg-purple-100 text-purple-600",
  },
  {
    name: "Watches",
    icon: Watch,
    href: "/category/watches",
    color: "bg-amber-100 text-amber-600",
  },
  {
    name: "Cameras",
    icon: Camera,
    href: "/category/cameras",
    color: "bg-red-100 text-red-600",
  },
  {
    name: "Home & Garden",
    icon: Home,
    href: "/category/home-garden",
    color: "bg-green-100 text-green-600",
  },
  {
    name: "Collectibles",
    icon: Gift,
    href: "/category/collectibles",
    color: "bg-indigo-100 text-indigo-600",
  },
]

export default function CategoryGrid() {
  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">Shop by Category</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className="flex flex-col items-center p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-300"
            >
              <div className={`p-3 rounded-full ${category.color} mb-4`}>
                <category.icon className="h-6 w-6" />
              </div>
              <span className="text-gray-900 font-medium text-center">{category.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

