import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription, catchError, ignoreElements, of, skip, take } from 'rxjs';
import { ILineChartsDatas } from 'src/app/core/services/interfaces/ILineChartsDatas';
import { OlympicService } from 'src/app/core/services/olympic.service';

// Metadatas
@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss']
})
export class DetailComponent implements OnInit, OnDestroy {

  countryName! : string | null
  linechartDatas$: Observable<ILineChartsDatas | undefined> = of(undefined)
  YticksList : number[] = [] /* = [0, 5 , 10, 15, 20]*/
  maxMedals : number = 0
  totalMedals : number = 0
  minYaxis : number = 0
  maxYaxis : number = 0
  view : [number, number] = [800, 400]
  totalAthletes$! : Observable<number>
  lineChartDatasSubscription! : Subscription

  isLoadingError$: Observable<boolean> = of(false)
  isLoading$: Observable<boolean> = of(false)
  totalAthletesError$: Observable<boolean> = of(false)

  constructor(private olympicService: OlympicService, private router:Router, private route: ActivatedRoute) { }

  ngOnInit(): void {

    this.isLoadingError$ = this.olympicService.getLoadingErrorStatus$()
    this.isLoading$ = this.olympicService.getLoadingStatus$()

    // if no country in the url
    this.countryName = this.route.snapshot.paramMap.get('id')
    if(this.countryName == null) return

    this.totalAthletes$ = this.olympicService.getCountryTotalAthletes$(this.countryName)
    this.linechartDatas$ = this.olympicService.getCountryLineChartDatas$(this.countryName)

    this.totalAthletesError$ = this.totalAthletes$.pipe(
      ignoreElements(),
      catchError((err) => of(err))
    )

    this.lineChartDatasSubscription = this.olympicService.getCountryLineChartDatas$(this.countryName).subscribe({
      
      next : (datas) => {
        // if country doesn't exist in the datas
        if(datas == null) {
          this.router.navigateByUrl('/404')
          return
        }
        const medalsList = datas.series?.map(serie => serie.value)
        // retrieve the Y min / max values to scale the Y Axis
        this.minYaxis = Math.floor((Math.min(...medalsList) / 10)) * 10
        if(this.minYaxis < 0) this.minYaxis = 0
        this.maxYaxis = Math.ceil((Math.max(...medalsList) / 10)) * 10

        this.totalMedals = datas.series.reduce((acc, serie) => acc + serie.value, 0)

        // if maxY-minY <= 20 then ticks are spaced by 5
        // if > 20 then spaced by 10
        let space = 10
        if(this.maxYaxis-this.minYaxis <= 20) space = 5
        if(this.maxYaxis-this.minYaxis <= 10) space = 2
        let currentTick = this.minYaxis
        while(currentTick<=this.maxYaxis){
          this.YticksList.push(currentTick)
          currentTick += space
        }
      },

      error : (error : any) => {
        console.log(error)
      }
    }) // deal with complete ?

    const windowWidth = window.innerWidth
    this.refreshGraphContainer(windowWidth)
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
   * Refreshes the graph container based on the window width.
   * @param {number} windowWidth - The width of the window.
   * @returns {Array<number>} An array containing the width and height of the graph container.
   */
  refreshGraphContainer(windowWidth : number) : [number, number] {
    if(windowWidth <= 420) return this.view = [300, 300]
    if(windowWidth <= 600) return this.view = [400, 300]
    if(windowWidth <= 1200) return this.view = [600, 400]
    return this.view = [800, 400]
  }

  ngOnDestroy(): void{
    this.lineChartDatasSubscription.unsubscribe()
  }

}
