import { Component, EventEmitter, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Color, ScaleType } from '@swimlane/ngx-charts';
import { Observable, Subscription, of } from 'rxjs';
import { OlympicService } from 'src/app/core/services/olympic.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {

  olympics$: Observable<any> = of(null)
  numberOfJOs$: Observable<any> = of(null);
  pieChartsDatas$: Observable<{name : string, value : number} []> = of([])
  view : [number, number] = [1200, 600]

  colorScheme : Color = {
    domain:['#956065', '#793d52', '#89a1db', '#9780a1', '#bfe0f1'], // change color order
    group: ScaleType.Linear,
    selectable: true,
    name: 'Pie Scheme',
  }

  isError = false
  olympicsSubscription! : Subscription

  // change font weight of all country names

  constructor(private olympicService: OlympicService, private router : Router, private route : ActivatedRoute,) {}

  ngOnInit(): void {
    this.olympics$ = this.olympicService.getOlympics$()
    this.pieChartsDatas$ = this.olympicService.getPieChartDatas$()
    this.numberOfJOs$ = this.olympicService.getNumberOfJOs$()
    this.olympicsSubscription = this.olympics$.subscribe({
      error : (err : any) => {
        console.log("Can't load the datas.")
        this.isError = true
      }
    })
  }

  setLabelFormatting(label : string): string {
    return `${label}`
  }

  onSelect(event : EventEmitter<any>){
    if(event.name != null) {
      this.router.navigateByUrl(`detail/${event.name.toLowerCase()}`) 
      return
    }
  }

  onResize(event : UIEvent) : [number, number] { // show not only take into account resize but initialsize too
    const windowWidth = (event.target as Window).innerWidth
    if(windowWidth <= 420) return this.view = [300, 200]
    if(windowWidth <= 800) return this.view = [400, 300]
    if(windowWidth <= 1200) return this.view = [800, 400]
    return this.view = [1400, 600]
  }

  ngOnDestroy(): void{
    this.olympicsSubscription.unsubscribe()
  }
}
