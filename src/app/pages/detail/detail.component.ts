import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { ILineChartsDatas } from 'src/app/core/services/ILineChartsDatas';
import { OlympicService } from 'src/app/core/services/olympic.service';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss']
})
export class DetailComponent implements OnInit {

  public countryName! : string | null
  public linechartDatas$: Observable<ILineChartsDatas> = of()
  YticksList : number[] = []/* = [0, 5 , 10, 15, 20]*/
  maxMedals! : number
  totalMedals! : number
  minYaxis! : number
  maxYaxis! : number
  view : [number, number] = [800, 400]
  totalAthletes$! : Observable<number>

  constructor(private olympicService: OlympicService, private router:Router, private route: ActivatedRoute) { }

  ngOnInit(): void {

    this.countryName = this.route.snapshot.paramMap.get('id')
    if(this.countryName == null) {
      this.router.navigateByUrl('/404') 
      return
    }

    this.totalAthletes$ = this.olympicService.getCountryTotalAthletes$(this.countryName)
    this.linechartDatas$ = this.olympicService.getCountryLineChartDatas$(this.countryName)
    this.olympicService.getCountryLineChartDatas$(this.countryName).subscribe(datas => { // !!! don't forget to unsub
      
      const medalsList = datas.series?.map(serie => serie.value)
      this.minYaxis = Math.floor((Math.min(...medalsList) / 10)) * 10
      if(this.minYaxis < 0) this.minYaxis = 0
      this.maxYaxis = Math.ceil((Math.max(...medalsList) / 10)) * 10

      this.totalMedals = datas.series.reduce((acc, serie) => acc + serie.value, 0)

      // if maxY-minY <= 20 then ticks are space by 5
      // if > 20 then spaced by 10
      let space = 10
      if(this.maxYaxis-this.minYaxis <= 20) space = 5
      if(this.maxYaxis-this.minYaxis <= 10) space = 2
      let currentTick = this.minYaxis
      while(currentTick<=this.maxYaxis){
        this.YticksList.push(currentTick)
        currentTick += space
      }
      console.log(this.YticksList)
      
    })
  }

  onResize(event : UIEvent) : [number, number] { // show not only take into account resize but initialsize too
    const windowWidth = (event.target as Window).innerWidth
    if(windowWidth <= 420) return this.view = [300, 300]
    if(windowWidth <= 600) return this.view = [400, 300]
    if(windowWidth <= 1200) return this.view = [600, 400]
    return this.view = [800, 400]
  }

}
