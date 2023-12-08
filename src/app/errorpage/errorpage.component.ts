import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-errorpage',
  templateUrl: './errorpage.component.html',
  styleUrl: './errorpage.component.scss'
})
export class ErrorpageComponent implements OnInit, OnDestroy {
  message:string = "";
  private sub:any;
  
  constructor(private route: ActivatedRoute) { }
  
  ngOnInit(): void {
    this.sub = this.route.params.subscribe(params => {
      this.message = params['message'];
    });
  }

  ngOnDestroy(): void {
      this.sub.unsubscribe()
  }

}
