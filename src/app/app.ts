import { Component, signal, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { ThemeService } from './core/services/theme.service';
import { SeoService } from './core/services/seo.service';
import { filter, map, mergeMap } from 'rxjs/operators';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app.css',
})
export class App implements OnInit {
  private seoService = inject(SeoService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private titleService = inject(Title);

  constructor(private themeService: ThemeService) {}

  ngOnInit() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => this.activatedRoute),
        map((route) => {
          while (route.firstChild) {
            route = route.firstChild;
          }
          return route;
        }),
        filter((route) => route.outlet === 'primary'),
        mergeMap((route) => route.data)
      )
      .subscribe((event) => {
        // Angular Router sets the title automatically if 'title' is in route config
        // access it via Title service if needed, or just set defaults
        const title = this.titleService.getTitle();
        this.seoService.updateMetaTags({
          title: title,
          description: 'Spendly - Smarter Financial Tracking',
          image: 'assets/icons/icon-512x512.png',
          url: window.location.href,
        });
      });
  }
}
