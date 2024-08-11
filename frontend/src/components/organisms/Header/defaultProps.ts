import { MenuProps } from "../../molecules/Menu/Menu"

export const menuProps: MenuProps = {
  menuItems: [
    {
      key: 0,
      parentItem: "Start order",
      items: [
        {
          link: "/generate-start-order",
          title: "Generate start order",
          authenticated: true
        }
      ]
    },
    {
      parentItem: "Results",
      key: 1,
      items: [
        {
          link: "/crews",
          title: "All crews",
          authenticated: true
        },
        {
          link: "/race-times",
          title: "Race times",
          authenticated: true
        },
        {
          link: "/results",
          title: "Results",
          authenticated: false
        },
        {
          link: "/import",
          title: "Import data",
          authenticated: true
        },
        {
          link: "/export",
          title: "Export data",
          authenticated: true
        }
      ]
    },
    {
      parentItem: "Settings",
      key: 2,
      items: [
        {
          link: "/keys",
          title: "Add or change event key",
          authenticated: true
        },
        {
          link: "/register",
          title: "Register user",
          authenticated: true
        },
        {
          link: "/login",
          title: "Login",
          authenticated: false
        },
        {
          link: "/logout",
          title: "Logout",
          authenticated: false
        },
        {
          link: "/logout",
          title: "Need to restore the onclick Logout function...",
          authenticated: false
        }
      ]
    }
  ]
}