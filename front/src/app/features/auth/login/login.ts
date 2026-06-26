import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrls: ['../auth.scss'],
  imports: [ReactiveFormsModule, RouterLink],
})
export class LoginComponent {
  private fb   = inject(FormBuilder);
  authService  = inject(AuthService);

  form: FormGroup = this.fb.group({
    email:      ['', [Validators.required, Validators.email]],
    password:   ['', Validators.required],
    rememberMe: [false],
  });

  loading  = false;
  error    = '';
  showPass = false;

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.error   = '';

    this.authService.login(this.form.value).subscribe({
      next: () => {
        this.loading = false;
        this.authService.redirectAfterLogin();
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Erreur de connexion. Réessayez.';
      },
    });
  }

  get email()    { return this.form.get('email')!; }
  get password() { return this.form.get('password')!; }
}
