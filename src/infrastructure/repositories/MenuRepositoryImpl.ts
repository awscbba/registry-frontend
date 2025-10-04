import { MenuItem, MenuItemType, StatsSubMenu } from '../../domain/entities/AdminDashboard';
import type { MenuRepository } from '../../domain/usecases/MenuNavigationUseCase';

export class MenuRepositoryImpl implements MenuRepository {
  private currentMenuItem: MenuItem = new MenuItem('dashboard', 'Dashboard', true);

  getCurrentMenuItem(): MenuItem {
    return this.currentMenuItem;
  }

  setCurrentMenuItem(type: MenuItemType): void {
    const menuConfig = {
      dashboard: { label: 'Dashboard', hasSubMenu: false },
      users: { label: 'Users', hasSubMenu: false },
      projects: { label: 'Projects', hasSubMenu: false },
      stats: { label: 'Stats', hasSubMenu: true }
    };

    const config = menuConfig[type];
    this.currentMenuItem = new MenuItem(type, config.label, true, config.hasSubMenu);
  }

  getStatsSubMenuItems(): StatsSubMenu[] {
    return [
      new StatsSubMenu('performance', 'Performance', '📊', 'System performance metrics and monitoring'),
      new StatsSubMenu('cache', 'Cache', '⚡', 'Cache management and optimization'),
      new StatsSubMenu('database', 'Database', '🗄️', 'Database performance and optimization')
    ];
  }
}
