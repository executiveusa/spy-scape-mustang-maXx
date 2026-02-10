'use client';

import { Shield, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';
import Link from 'next/link';

const footerLinks = {
  company: [
    { name: 'About Us', href: '#' },
    { name: 'Careers', href: '#' },
    { name: 'Press', href: '#' },
    { name: 'Blog', href: '#' },
  ],
  programs: [
    { name: 'Training', href: '#' },
    { name: 'Missions', href: '#' },
    { name: 'Gadgets', href: '#' },
    { name: 'Events', href: '#' },
  ],
  support: [
    { name: 'Help Center', href: '#' },
    { name: 'Contact', href: '#' },
    { name: 'FAQs', href: '#' },
    { name: 'Status', href: '#' },
  ],
  legal: [
    { name: 'Privacy', href: '#' },
    { name: 'Terms', href: '#' },
    { name: 'Cookies', href: '#' },
    { name: 'Licenses', href: '#' },
  ],
};

const socialLinks = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Youtube, href: '#', label: 'Youtube' },
];

export default function Footer() {
  return (
    <footer className="bg-spy-black border-t border-spy-gray">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-8 h-8 text-spy-accent" />
              <span className="text-xl font-bold text-white">SPYSCAPE</span>
            </div>
            <p className="text-gray-400 text-sm mb-6">
              The world's most advanced espionage training facility. 
              Transform from ordinary to extraordinary.
            </p>
            <div className="space-y-3 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-spy-accent" />
                <span>Classified Location</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-spy-accent" />
                <span>contact@spyscape.007</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-spy-accent" />
                <span>+00 007 000 006</span>
              </div>
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="text-white font-bold mb-6">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-gray-400 hover:text-spy-accent transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Programs</h4>
            <ul className="space-y-3">
              {footerLinks.programs.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-gray-400 hover:text-spy-accent transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-gray-400 hover:text-spy-accent transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-gray-400 hover:text-spy-accent transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-12 pt-12 border-t border-spy-gray">
          <div className="max-w-xl mx-auto text-center">
            <h4 className="text-white font-bold mb-4">Stay Updated</h4>
            <p className="text-gray-400 text-sm mb-6">
              Subscribe to receive classified updates on new training programs and missions.
            </p>
            <form className="flex gap-2 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-grow px-4 py-2 bg-spy-gray border border-spy-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-spy-accent"
              />
              <button 
                type="submit"
                className="btn-spy-primary text-sm"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-spy-gray">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              © 2024 SpyScape. All rights reserved. | MustNG Maxx 006
            </p>
            
            {/* Social Links */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="p-2 rounded-lg bg-spy-gray hover:bg-spy-accent/20 transition-colors"
                >
                  <social.icon className="w-5 h-5 text-gray-400 hover:text-spy-accent" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
