import { Link } from "react-router-dom"
import { categoriesData } from "../../assets/assets"

const HomeCategories = () => {
  return (
    <section className="py-16">
        <div className="max-w-7xl mx-auto">
            <div>
                <h2 className="text-2xl font-semibold">Browse Categires</h2>
                <p className="text-sm text-app-text-light mt-1">Find excately what you need using </p>
            </div>

            <div className="flex items-center mt-8 overflow-x-scroll no-scrollbar">
                {
                    categoriesData.map((cat) => (
                        <Link to={`/products?category=${cat.slug}`} key={cat.slug}
                            onClick={() => window.scrollTo(0,0)}
                            className="group flex flex-col items-center gap-3 p-4"
                        >
                            <div className="size-18 sm:size-26 sm:p-2 rounded-2xl overflow-hidden border-green-100 group-hover:ring-2 ring-orange-300/75 transition-all">
                                <img src={cat?.image} alt={cat?.name} className="w-full h-full object-contian rounded-full transition-all" />
                            </div>

                            <span className="text-xs font-medium text-zinc-600 text-center leading-tight">
                                {cat?.name}
                            </span>

                        </Link>
                    ))
                }

            </div>

        </div>
    </section>
  )
}

export default HomeCategories