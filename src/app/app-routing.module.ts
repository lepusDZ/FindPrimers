import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainPageComponent } from './main-page/main-page.component';
import { ScrollComponent } from './scroll/scroll.component';
import { OutputComponent } from './output/output.component';
import { ErrorpageComponent } from './errorpage/errorpage.component';

const appRoutes: Routes = [
    { path: 'scroll', component: ScrollComponent },
    { path: '', component: MainPageComponent },
    { path: 'output', component: OutputComponent },
    {path: 'error/:message', component: ErrorpageComponent}
];

@NgModule({
    imports: [RouterModule.forRoot(appRoutes)],
    exports: [RouterModule],
})
export class AppRoutingModule { }
