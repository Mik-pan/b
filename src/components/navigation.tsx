"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
    label: string;
    href: string;
};

type NavigationProps = {
    items: NavItem[];
};

export function Navigation({ items }: NavigationProps) {
    const pathname = usePathname();

    return (
        <nav>
            <ul className="nav-menu">
                {items.map((item) => {
                    const isActive = pathname === item.href;

                    return (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                className={isActive ? "active" : ""}
                            >
                                {item.label}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
