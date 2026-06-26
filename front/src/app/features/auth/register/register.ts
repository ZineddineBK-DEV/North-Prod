import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

const GENRES = ['Rap','Trap','Drill','LoFi','Old School','Freestyle','R&B','Afrobeats','Pop','Rock','Jazz','Soul','Electronic','Autre'];

@Component({
  selector: 'app-register',
  templateUrl: './register.html',
  styleUrls: ['../auth.scss'],
  imports: [ReactiveFormsModule, RouterLink],
})
export class RegisterComponent {
  private fb  = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  genres = GENRES;
  step = signal(1);  // 1 = account info, 2 = artist profile
  loading  = false;
  error    = '';
  success  = false;
  showPass = false;
  selectedGenres: string[] = [];

  form: FormGroup = this.fb.group({
    aka:       ['', [Validators.required, Validators.maxLength(60)]],
    firstName: ['', Validators.required],
    lastName:  ['', Validators.required],
    email:     ['', [Validators.required, Validators.email]],
    password:  ['', [Validators.required, Validators.minLength(8),
                     Validators.pattern(/^(?=.*[A-Z])(?=.*[0-9]).+$/)]],
    phone:     [''],
    bio:       ['', Validators.maxLength(500)],
  });

  toggleGenre(genre: string) {
    const idx = this.selectedGenres.indexOf(genre);
    if (idx > -1) this.selectedGenres.splice(idx, 1);
    else if (this.selectedGenres.length < 5) this.selectedGenres.push(genre);
  }

  isSelected(genre: string) { return this.selectedGenres.includes(genre); }

  get passwordStrength(): number {
    const pw = this.form.get('password')?.value || '';
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  }
  get strengthLabel(): string {
    return ['', 'Faible', 'Moyen', 'Fort', 'Très fort'][this.passwordStrength];
  }
  get strengthColor(): string {
    return ['', '#e74c3c', '#f39c12', '#2ecc71', '#27ae60'][this.passwordStrength];
  }

  nextStep() {
    const stepFields = ['aka','firstName','lastName','email','password'];
    stepFields.forEach((f) => this.form.get(f)?.markAsTouched());
    const valid = stepFields.every((f) => this.form.get(f)?.valid);
    if (valid) this.step.set(2);
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.error   = '';

    const payload = { ...this.form.value, musicalGenres: this.selectedGenres };
    this.auth.register(payload).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Erreur lors de la création du compte.';
      },
    });
  }

  get aka()       { return this.form.get('aka')!; }
  get firstName() { return this.form.get('firstName')!; }
  get lastName()  { return this.form.get('lastName')!; }
  get email()     { return this.form.get('email')!; }
  get password()  { return this.form.get('password')!; }
}
