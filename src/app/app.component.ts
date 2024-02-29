import { Component, OnInit } from '@angular/core';
import { take } from 'rxjs';
import { OlympicService } from './core/services/olympic.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  constructor(private olympicService: OlympicService) {}

  public title : string = "olympic-games-starter"

  // create the olympic$ observable with the json datas
  ngOnInit(): void {
    this.olympicService.loadInitialData().pipe(take(1)).subscribe()
  }
}
