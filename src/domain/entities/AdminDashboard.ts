export type MenuItemType = 'dashboard' | 'users' | 'projects' | 'stats';
export type StatsSubMenuType = 'performance' | 'cache' | 'database';

export class MenuItem {
  constructor(
    public readonly type: MenuItemType,
    public readonly label: string,
    public readonly isActive: boolean = false,
    public readonly hasSubMenu: boolean = false
  ) {}

  activate(): MenuItem {
    return new MenuItem(this.type, this.label, true, this.hasSubMenu);
  }

  deactivate(): MenuItem {
    return new MenuItem(this.type, this.label, false, this.hasSubMenu);
  }
}

export class StatsSubMenu {
  constructor(
    public readonly type: StatsSubMenuType,
    public readonly label: string,
    public readonly icon: string,
    public readonly description: string
  ) {}
}
