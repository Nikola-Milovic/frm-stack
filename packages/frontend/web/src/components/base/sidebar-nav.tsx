import { createElement, useState, type ComponentType, type ElementType, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "#lib/utils";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
} from "#components/base/sidebar";

type SidebarNavComponent = ElementType;

interface SidebarNavLinkProps {
  href?: string;
  component?: SidebarNavComponent;
  componentProps?: Record<string, unknown>;
  id?: string;
  dataTestId?: string;
  ariaLabel?: string;
}

interface SidebarNavBaseItemProps extends SidebarNavLinkProps {
  label: string;
  icon?: ComponentType<{ className?: string }>;
  isActive?: boolean;
}

export interface SidebarNavItemProps extends SidebarNavBaseItemProps {
  description?: string;
}

export interface SidebarNavExpandableItems extends SidebarNavBaseItemProps {
  dataTestId?: string;
}

export interface SidebarNavExpandableProps {
  label: string;
  icon?: ComponentType<{ className?: string }>;
  id: string;
  dataTestId?: string;
  defaultOpen?: boolean;
  items: SidebarNavExpandableItems[];
}

export interface SidebarNavSectionProps {
  title?: string;
  sectionId: string;
  showSeparator?: boolean;
  dataTestId?: string;
  children: ReactNode;
}

export interface SidebarNavProps {
  children: ReactNode;
  dataTestId?: string;
}

function buildNavComponent(
  { component, componentProps, href, id, dataTestId, ariaLabel }: SidebarNavLinkProps,
  content: ReactNode,
) {
  const Comp = component ?? (href ? "a" : "button");
  const finalProps: Record<string, unknown> = {
    ...componentProps,
  };

  if (href) {
    finalProps.href = href;
  }

  if (id && finalProps.id === undefined) {
    finalProps.id = id;
  }

  if (dataTestId && finalProps["data-testid"] === undefined) {
    finalProps["data-testid"] = dataTestId;
  }

  if (ariaLabel && finalProps["aria-label"] === undefined) {
    finalProps["aria-label"] = ariaLabel;
  }

  if (!href && !component && (Comp as string) === "button") {
    finalProps.type = "button";
  }

  return createElement(Comp as SidebarNavComponent, finalProps, content);
}

export function SidebarNav({ children, dataTestId }: SidebarNavProps) {
  return (
    <div className="flex flex-col gap-4" data-testid={dataTestId}>
      {children}
    </div>
  );
}

export function SidebarNavSection({ title, sectionId, showSeparator, dataTestId, children }: SidebarNavSectionProps) {
  return (
    <SidebarGroup data-testid={dataTestId ?? `sidebar-section-${sectionId}`}>
      {title ? <SidebarGroupLabel data-testid={`sidebar-section-title-${sectionId}`}>{title}</SidebarGroupLabel> : null}
      <SidebarMenu>{children}</SidebarMenu>
      {showSeparator ? <SidebarSeparator data-testid={`sidebar-section-separator-${sectionId}`} /> : null}
    </SidebarGroup>
  );
}

export function SidebarNavItem({
  icon: Icon,
  label,
  description,
  isActive,
  dataTestId,
  ariaLabel,
  ...linkProps
}: SidebarNavItemProps) {
  const content = (
    <span className="flex w-full items-center gap-2">
      {Icon ? (
        <Icon className="h-4 w-4" aria-hidden data-testid={dataTestId ? `${dataTestId}-icon` : undefined} />
      ) : null}
      <span className="flex-1 truncate" data-testid={dataTestId ? `${dataTestId}-label` : undefined}>
        {label}
      </span>
      {description ? (
        <span
          className="text-xs text-muted-foreground"
          data-testid={dataTestId ? `${dataTestId}-description` : undefined}
        >
          {description}
        </span>
      ) : null}
    </span>
  );

  return (
    <SidebarMenuItem data-testid={dataTestId ? `${dataTestId}-item` : undefined}>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        aria-label={ariaLabel ?? label}
        aria-current={isActive ? "page" : undefined}
        data-testid={dataTestId ? `${dataTestId}-button` : undefined}
      >
        {buildNavComponent(
          {
            ...linkProps,
            dataTestId,
            ariaLabel: ariaLabel ?? label,
          },
          content,
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function SidebarNavExpandable({
  label,
  icon: Icon,
  items,
  defaultOpen,
  id,
  dataTestId,
}: SidebarNavExpandableProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen ?? false);

  return (
    <SidebarMenuItem data-testid={dataTestId ? `${dataTestId}-container` : undefined}>
      <SidebarMenuButton
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls={`${id}-content`}
        data-testid={dataTestId}
        id={id}
      >
        <span className="flex-1 flex items-center gap-2">
          {Icon ? (
            <Icon className="h-4 w-4" aria-hidden data-testid={dataTestId ? `${dataTestId}-icon` : undefined} />
          ) : null}
          <span data-testid={dataTestId ? `${dataTestId}-label` : undefined}>{label}</span>
        </span>
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", isOpen ? "rotate-180" : "rotate-0")}
          aria-hidden
          data-testid={dataTestId ? `${dataTestId}-chevron` : undefined}
        />
      </SidebarMenuButton>
      <SidebarMenuSub
        id={`${id}-content`}
        data-testid={dataTestId ? `${dataTestId}-content` : undefined}
        className={cn(!isOpen && "hidden")}
      >
        {items.map((item) => {
          const content = (
            <span className="flex w-full items-center gap-2">
              {item.icon ? (
                <item.icon
                  className="h-4 w-4"
                  aria-hidden
                  data-testid={item.dataTestId ? `${item.dataTestId}-icon` : undefined}
                />
              ) : null}
              <span data-testid={item.dataTestId ? `${item.dataTestId}-label` : undefined}>{item.label}</span>
            </span>
          );

          return (
            <SidebarMenuSubItem key={item.id ?? item.href ?? item.label}>
              <SidebarMenuSubButton
                asChild
                isActive={item.isActive}
                aria-label={item.ariaLabel ?? item.label}
                aria-current={item.isActive ? "page" : undefined}
                data-testid={item.dataTestId ? `${item.dataTestId}-button` : undefined}
              >
                {buildNavComponent(
                  {
                    component: item.component,
                    componentProps: item.componentProps,
                    href: item.href,
                    id: item.id,
                    dataTestId: item.dataTestId,
                    ariaLabel: item.ariaLabel ?? item.label,
                  },
                  content,
                )}
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          );
        })}
      </SidebarMenuSub>
    </SidebarMenuItem>
  );
}
