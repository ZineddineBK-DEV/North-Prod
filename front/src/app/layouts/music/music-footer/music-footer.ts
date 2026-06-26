import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TapToTop } from '../../../shared/components/tap-to-top/tap-to-top';

@Component({
  selector: 'app-music-footer',
  templateUrl: './music-footer.html',
  styleUrls: ['./music-footer.scss'],
  imports: [ReactiveFormsModule, RouterLink, TapToTop],
})
export class MusicFooter {
  private fb = inject(FormBuilder);
  form = this.fb.group({
    name:    ['', Validators.required],
    email:   ['', [Validators.required, Validators.email]],
    subject: [''],
    message: ['', Validators.required],
  });
  sent = false; sending = false;

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.sending = true;
    setTimeout(() => { this.sent = true; this.sending = false; this.form.reset(); }, 1000);
  }
}
