import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormComponent } from './main-page/form/form.component';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PlasmidComponent } from './main-page/plasmid/plasmid.component';
import { MatTooltipModule } from '@angular/material/tooltip';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AtgcInputRestrictorDirective } from './atgc-input-restrictor.directive';

import { LinearComponent } from './main-page/linear/linear.component';
import { ScrollComponent } from './scroll/scroll.component';
import { AppRoutingModule } from './app-routing.module';
import { MainPageComponent } from './main-page/main-page.component';
import { PlasmidScrollComponent } from './scroll/plasmid-scroll/plasmid-scroll.component';
import { ButtonsComponent } from './scroll/buttons/buttons.component';
import { LinearScrollComponent } from './scroll/linear-scroll/linear-scroll.component';
import { DragDropComponent } from './scroll/drag-drop/drag-drop.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { HttpClientModule } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser'
import { PipeTransform, Pipe } from "@angular/core";

@Pipe({
  name: 'safeHtml'
})
export class SafeHtmlPipe implements PipeTransform {
  constructor(private sanitized: DomSanitizer) { }
  transform(value: any) {
    return this.sanitized.bypassSecurityTrustHtml(value);
  }
}

@NgModule({
  declarations: [
    AppComponent,
    FormComponent,
    PlasmidComponent,
    AtgcInputRestrictorDirective,
    LinearComponent,
    ScrollComponent,
    MainPageComponent,
    PlasmidScrollComponent,
    ButtonsComponent,
    LinearScrollComponent,
    DragDropComponent,
    SafeHtmlPipe
  ],
  imports: [
    BrowserModule,
    NgbModule,
    FormsModule,
    BrowserAnimationsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    MatTooltipModule,
    AppRoutingModule,
    DragDropModule,
    HttpClientModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }