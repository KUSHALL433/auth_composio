import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Difficulty } from '../../core/models/api.models';

@Component({
  selector: 'app-difficulty-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge" [ngClass]="'badge-' + (difficulty || 'unknown')">
      {{ difficulty | titlecase }}
    </span>
  `
})
export class DifficultyBadgeComponent {
  @Input() difficulty: Difficulty = 'unknown';
}
