import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.html',
  styleUrls: ['../auth.scss'],
  imports: [ReactiveFormsModule, RouterLink],
})
export class ResetPasswordComponent implements OnInit {
  private fb    = inject(FormBuilder);
  private auth  = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  token    = '';
  loading  = false;
  error    = '';
  success  = false;
  showPass = false;
  showConfirm = false;

  form = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(8),
                    Validators.pattern(/^(?=.*[A-Z])(?=.*[0-9]).+$/)]],
    confirm:  ['', Validators.required],
  }, { validators: this.matchPasswords });

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) this.error = 'Lien invalide ou expiré.';
  }

  matchPasswords(group: any) {
    const pw = group.get('password')?.value;
    const co = group.get('confirm')?.value;
    return pw === co ? null : { mismatch: true };
  }

  submit() {
    if (this.form.invalid || !this.token) { this.form.markAllAsTouched(); return; }
    this.loading = true; this.error = '';
    this.auth.resetPassword(this.token, this.form.value.password!).subscribe({
      next: () => { this.loading = false; this.success = true; },
      error: (err) => { this.loading = false; this.error = err.error?.message || 'Token invalide ou expiré.'; },
    });
  }

  get password() { return this.form.get('password')!; }
  get confirm()  { return this.form.get('confirm')!; }
}
