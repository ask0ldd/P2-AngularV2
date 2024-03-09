import { Component, EventEmitter, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Color, ScaleType } from '@swimlane/ngx-charts';
import { Observable, catchError, ignoreElements, of } from 'rxjs';
import { IOlympic } from 'src/app/core/models/IOlympic';
import { OlympicService } from 'src/app/core/services/olympic.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})

export class HomeComponent implements OnInit {

  olympics$: Observable<IOlympic[]> = of([])
  numberOfJOs$: Observable<number> = of(0);
  pieChartsDatas$: Observable<{name : string, value : number} []> = of([])
  view : [number, number] = [1200, 600]

  colorScheme : Color = {
    domain:['#956065', '#bfe0f1', '#89a1db', '#793d52', '#9780a1', '#bfe0f1'], // change color order
    group: ScaleType.Linear,
    selectable: true,
    name: 'Pie Scheme',
  }

  isLoadingError$: Observable<boolean> = of(false)
  isLoading$: Observable<boolean> = of(false)
  numberOfJOsError$: Observable<boolean> = of(false)

  constructor(private olympicService: OlympicService, private router : Router, private route : ActivatedRoute,) {}

  ngOnInit(): void {

    this.isLoadingError$ = this.olympicService.getLoadingErrorStatus$()
    this.isLoading$ = this.olympicService.getLoadingStatus$()

    this.pieChartsDatas$ = this.olympicService.getPieChartDatas$()
    this.numberOfJOs$ = this.olympicService.getNumberOfJOs$()
    this.numberOfJOsError$ = this.numberOfJOs$.pipe(
      ignoreElements(),
      catchError((err) => of(err))
    )

    const windowWidth = window.innerWidth
    this.refreshGraphContainer(windowWidth)
  }

  /**
   * Sets the formatting for a label.
   * @param {string} label - The label to be formatted.
   * @returns {string} - The formatted label.
   */
  setLabelFormatting(label : string): string {
    return `${label}`
  }

  /**
   * Redirect to the selected country when clicking on a pie.
   * 
   * @param {EventEmitter<any>} event - The event triggered by clicking on a pie.
   */
  onSelect(event : EventEmitter<any>){
    if(event.name != null) {
      this.router.navigateByUrl(`detail/${event.name.toLowerCase()}`) 
      return
    }
  }

  /**
   * Function that handles the resize event and refreshes the graph container based on the window width.
   * @param {UIEvent} event - The resize event object.
   * @returns {void}
   */
  onResize(event : UIEvent) : void { 
    const windowWidth = (event.target as Window).innerWidth
    this.refreshGraphContainer(windowWidth)
  }

  /**
   * Updates the dimensions of the graph container based on the window width.
   * @param {number} windowWidth - The width of the window.
   * @returns {Array<number>} An array containing the new dimensions for the graph container.
   */
  refreshGraphContainer(windowWidth : number) : [number, number] {
    if(windowWidth <= 500) return this.view = [300, 200]
    if(windowWidth <= 600) return this.view = [400, 300]
    if(windowWidth <= 800) return this.view = [500, 300]
    if(windowWidth <= 1200) return this.view = [800, 400]
    return this.view = [1400, 600]
  }
}
