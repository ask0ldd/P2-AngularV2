import { Component, EventEmitter, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Color, ScaleType } from '@swimlane/ngx-charts';
import { Observable, of } from 'rxjs';
import { OlympicService } from 'src/app/core/services/olympic.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {

  public olympics$: Observable<any> = of(null)
  public numberOfJOs$: Observable<any> = of(null);
  public pieChartsDatas$: Observable<{name : string, value : number} []> = of([])

  public colorScheme : Color = {
    domain:['#956065', '#793d52', '#89a1db', '#9780a1', '#bfe0f1'],
    group: ScaleType.Linear,
    selectable: true,
    name: 'Pie Scheme',
  }

  constructor(private olympicService: OlympicService, private router : Router, private route : ActivatedRoute,) {}

  ngOnInit(): void {
    this.olympics$ = this.olympicService.getOlympics$()
    this.pieChartsDatas$ = this.olympicService.getPieChartDatas$()
    this.numberOfJOs$ = this.olympicService.getNumberOfJOs$()
  }

  setLabelFormatting(label : string): string {
    return `${label}`
  }

  onSelect(event : EventEmitter<any>){
    // event obj : {name: 'Italy', value: 96, label: 'Italy'}
    if(event.name != null) {
      this.router.navigateByUrl(`detail/${event.name.toLowerCase()}`) 
      return
    }
  }
}
