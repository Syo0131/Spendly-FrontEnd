import { Injectable } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root',
})
export class SeoService {
  constructor(private title: Title, private meta: Meta) {}

  setCanonicalURL(url?: string) {
    const canURL = url == undefined ? window.location.href : url;
    const link: HTMLLinkElement =
      document.querySelector('link[rel="canonical"]') || document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
    link.setAttribute('href', canURL);
  }

  updateMetaTags(config: {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    keywords?: string;
  }) {
    // Description
    if (config.description) {
      this.meta.updateTag({ name: 'description', content: config.description });
      this.meta.updateTag({ property: 'og:description', content: config.description });
      this.meta.updateTag({ name: 'twitter:description', content: config.description });
    }

    // Title (Socials)
    if (config.title) {
      this.meta.updateTag({ property: 'og:title', content: config.title });
      this.meta.updateTag({ name: 'twitter:title', content: config.title });
    }

    // Image
    if (config.image) {
      this.meta.updateTag({ property: 'og:image', content: config.image });
      this.meta.updateTag({ name: 'twitter:image', content: config.image });
      this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    }

    // URL
    if (config.url) {
      this.meta.updateTag({ property: 'og:url', content: config.url });
      this.setCanonicalURL(config.url);
    } else {
      this.setCanonicalURL();
    }

    // Keywords
    if (config.keywords) {
      this.meta.updateTag({ name: 'keywords', content: config.keywords });
    }
  }
}
