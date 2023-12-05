import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainPageComponent } from './main-page/main-page.component';
import { ScrollComponent } from './scroll/scroll.component';
import { OutputComponent } from './output/output.component';

const appRoutes: Routes = [
    { path: 'scroll', component: ScrollComponent },
    { path: '', component: MainPageComponent },
    { path: 'output', component: OutputComponent }, // Set MainPageComponent as the component for the home route ('/')
];

@NgModule({
    imports: [RouterModule.forRoot(appRoutes)],
    exports: [RouterModule],
})
export class AppRoutingModule { }
