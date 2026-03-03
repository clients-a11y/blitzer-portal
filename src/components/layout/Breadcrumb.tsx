import Link from 'next/link'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface Props {
  items: BreadcrumbItem[]
  dark?: boolean
}

export default function Breadcrumb({ items, dark = false }: Props) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`text-sm mb-4 ${dark ? 'text-slate-400' : 'text-slate-500'}`}
    >
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
              <span aria-hidden="true" className={dark ? 'text-slate-600' : 'text-slate-300'}>
                /
              </span>
            )}
            {item.href ? (
              <Link
                href={item.href}
                className={`transition-colors duration-200 hover:underline cursor-pointer ${
                  dark
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-500 hover:text-indigo-600'
                }`}
                itemProp="item"
              >
                <span itemProp="name">{item.label}</span>
              </Link>
            ) : (
              <span
                className={`font-medium ${dark ? 'text-slate-200' : 'text-slate-700'}`}
                itemProp="name"
                aria-current="page"
              >
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
