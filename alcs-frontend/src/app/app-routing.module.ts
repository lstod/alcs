import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthorizationComponent } from './features/authorization/authorization.component';
import { NotFoundComponent } from './features/errors/not-found/not-found.component';
import { LoginComponent } from './features/login/login.component';
import { ProvisionComponent } from './features/provision/provision.component';
import { AuthGuard } from './services/authentication/auth.guard';

const routes: Routes = [
  {
    path: 'board',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/board/board.module').then((m) => m.BoardModule),
  },
  {
    path: 'home',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/home/home.module').then((m) => m.HomeModule),
  },
  {
    path: 'application',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/application/application.module').then((m) => m.ApplicationModule),
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'authorized',
    component: AuthorizationComponent,
  },
  {
    path: 'provision',
    component: ProvisionComponent,
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', component: NotFoundComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
