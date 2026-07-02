import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if(visible) {
      <div class="cd-overlay" (click)="cancel()">
        <div class="cd-box" (click)="$event.stopPropagation()">
          <div class="cd-icon"><i class="fa fa-exclamation-triangle"></i></div>
          <h3 class="cd-title">{{ title }}</h3>
          <p  class="cd-msg">{{ message }}</p>
          <div class="cd-actions">
            <button class="cd-cancel"  (click)="cancel()">Annuler</button>
            <button class="cd-confirm" (click)="confirm()">{{ confirmLabel }}</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [\`
    .cd-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:2000;
      display:flex;align-items:center;justify-content:center;animation:cdIn 0.18s ease;}
    @keyframes cdIn{from{opacity:0}to{opacity:1}}
    .cd-box{background:#1a1a1a;border:1px solid rgba(192,160,96,0.2);border-radius:12px;
      padding:32px 28px;max-width:380px;width:90%;text-align:center;
      box-shadow:0 24px 60px rgba(0,0,0,0.6);animation:cdUp 0.2s ease;}
    @keyframes cdUp{from{transform:translateY(12px);opacity:0}to{transform:translateY(0);opacity:1}}
    .cd-icon{font-size:36px;color:#e67e22;margin-bottom:16px;}
    .cd-title{margin:0 0 8px;font-size:17px;font-weight:700;color:#fff;}
    .cd-msg{margin:0 0 24px;font-size:13px;color:rgba(255,255,255,0.55);line-height:1.5;}
    .cd-actions{display:flex;gap:10px;justify-content:center;}
    .cd-cancel{padding:10px 24px;background:transparent;border:1px solid rgba(255,255,255,0.15);
      border-radius:6px;color:rgba(255,255,255,0.6);font-size:13px;cursor:pointer;font-family:inherit;
      transition:all 0.2s;}
    .cd-cancel:hover{border-color:rgba(255,255,255,0.35);color:#fff;}
    .cd-confirm{padding:10px 24px;background:rgba(231,76,60,0.15);border:1px solid rgba(231,76,60,0.4);
      border-radius:6px;color:#e74c3c;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;
      transition:all 0.2s;}
    .cd-confirm:hover{background:rgba(231,76,60,0.25);border-color:#e74c3c;}
  \`]
})
export class ConfirmDialogComponent {
  @Input() visible    = false;
  @Input() title      = 'Confirmer la suppression';
  @Input() message    = 'Cette action est irréversible.';
  @Input() confirmLabel = 'Supprimer';
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  confirm() { this.confirmed.emit(); }
  cancel()  { this.cancelled.emit(); }
}
