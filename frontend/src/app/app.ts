import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// BUG-14: replaced Angular default starter template with plain router-outlet
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
