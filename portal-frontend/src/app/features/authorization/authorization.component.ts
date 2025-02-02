import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthenticationService } from '../../services/authentication/authentication.service';

@Component({
  selector: 'app-authorization',
  template: `<>`,
})
export class AuthorizationComponent implements OnInit {
  constructor(private route: ActivatedRoute, private router: Router, private authService: AuthenticationService) {}

  async ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('t');
    const refreshToken = this.route.snapshot.queryParamMap.get('r');
    if (token && refreshToken) {
      await this.authService.setTokens(token, refreshToken);

      const targetUrl = localStorage.getItem('targetUrl');
      if (targetUrl) {
        window.location.href = targetUrl;
      } else {
        await this.router.navigateByUrl('/landing');
      }
    } else {
      console.error('Failed to receive tokens from redirect');
    }
  }
}
