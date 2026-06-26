import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.html',
  styleUrls: ['../auth.scss'],
  imports: [RouterLink],
})
export class VerifyEmailComponent implements OnInit {
  private auth  = inject(AuthService);
  private route = inject(ActivatedRoute);

  loading = true;
  success = false;
  error   = '';

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) { this.loading = false; this.error = 'Lien invalide.'; return; }
    this.auth.verifyEmail(token).subscribe({
      next: () => { this.loading = false; this.success = true; },
      error: (err) => { this.loading = false; this.error = err.error?.message || 'Lien invalide ou expiré.'; },
    });
  }
}
