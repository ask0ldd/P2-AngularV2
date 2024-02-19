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
  }

  onResize(event : UIEvent) : [number, number] { // show not only take into account resize but initialsize too
    const windowWidth = (event.target as Window).innerWidth
    if(windowWidth <= 420) return this.view = [300, 300]
    if(windowWidth <= 600) return this.view = [400, 300]
    if(windowWidth <= 1200) return this.view = [600, 400]
    return this.view = [800, 400]
  }

}
