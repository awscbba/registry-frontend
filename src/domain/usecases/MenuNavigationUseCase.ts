import { MenuItem, MenuItemType, StatsSubMenu, StatsSubMenuType } from '../entities/AdminDashboard';

export interface MenuRepository {
  getCurrentMenuItem(): MenuItem;
  setCurrentMenuItem(type: MenuItemType): void;
  getStatsSubMenuItems(): StatsSubMenu[];
}

export class MenuNavigationUseCase {
  constructor(private menuRepo: MenuRepository) {}

  navigateToMenuItem(type: MenuItemType): MenuItem {
    this.menuRepo.setCurrentMenuItem(type);
    return this.menuRepo.getCurrentMenuItem();
  }

  getStatsOptions(): StatsSubMenu[] {
    return this.menuRepo.getStatsSubMenuItems();
  }
}

export class StatsMenuToggleUseCase {
  execute(isOpen: boolean): boolean {
    return !isOpen;
  }
}
