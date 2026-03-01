import Link from 'next/link'

interface BreadcrumbItem {
  label: string
  href?: string
}

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-gray-500 mb-6">
      <ol
        className="flex flex-wrap items-center gap-1"
        itemScope
        itemType="https://schema.org/BreadcrumbList"
      >
        {items.map((item, index) => (
          <li
            key={index}
            className="flex items-center gap-1"
            itemProp="itemListElement"
            itemScope
            itemType="https://schema.org/ListItem"
          >
            {index > 0 && (
              <span aria-hidden="true" className="text-gray-300">
                /
              </span>
            )}
            {item.href ? (
              <Link
                href={item.href}
                className="hover:text-[#003366] hover:underline transition-colors"
                itemProp="item"
              >
                <span itemProp="name">{item.label}</span>
              </Link>
            ) : (
              <span className="text-gray-700 font-medium" itemProp="name" aria-current="page">
                {item.label}
              </span>
            )}
            <meta itemProp="position" content={String(index + 1)} />
          </li>
        ))}
      </ol>
    </nav>
  )
}
