"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-navy/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold font-bold text-navy">
            BLB
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Bridging Loans Broker</p>
            <p className="text-xs text-slate-400">Independent Specialists</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <a href="#services" className="text-sm text-slate-300 hover:text-gold">
            Services
          </a>
          <a href="#about" className="text-sm text-slate-300 hover:text-gold">
            About
          </a>
          <a href="#enquire" className="text-sm text-slate-300 hover:text-gold">
            Enquire
          </a>
          <a href="#faq" className="text-sm text-slate-300 hover:text-gold">
            FAQ
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <a href="tel:02071774141" className="hidden text-sm text-gold sm:block">
            020 7177 4141
          </a>
          <a href="#enquire">
            <Button size="sm">Enquire Now</Button>
          </a>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="bg-navy-dark text-slate-400">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-3">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold font-bold text-navy">
              BLB
            </div>
            <p className="font-semibold text-white">Bridging Loans Broker</p>
          </div>
          <p className="text-sm leading-relaxed">
            Specialist unregulated bridging finance for business and investment
            purposes nationwide. Fast, flexible, and tailored to your property needs.
          </p>
        </div>
        <div>
          <h4 className="mb-4 font-semibold text-white">Contact</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gold" />
              12 Old Bond Street, Mayfair, London
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gold" />
              <a href="tel:02071774141" className="hover:text-gold">
                020 7177 4141
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gold" />
              <a
                href="mailto:daniel@bridgingloansbroker.co.uk"
                className="hover:text-gold"
              >
                daniel@bridgingloansbroker.co.uk
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 font-semibold text-white">Services</h4>
          <ul className="space-y-2 text-sm">
            <li>Residential Bridging Loans</li>
            <li>Commercial Bridging Loans</li>
            <li>Auction Bridging Finance</li>
            <li>Development Finance</li>
            <li>International Bridging Loans</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-6 py-6 text-center text-xs">
        © {new Date().getFullYear()} Bridging Loans Broker. All rights reserved.
        Bridging loans are not regulated by the FCA.
      </div>
    </footer>
  );
}
