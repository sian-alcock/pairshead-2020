import { MenuProps } from "../../molecules/Menu/Menu"

export const menuProps: MenuProps = {
  menuItems: [
    {
      key: 0,
      parentItem: "Start order",
      link: "/generate-start-order",
      authenticated: true,
      items: [
        {
          link: "/generate-start-order",
          title: "Generate start order",
          authenticated: true
        }
      ]
    },
    {
      key: 1,
      parentItem: "Logistics",
      link: "/logistics",
      authenticated: true,
      items: [
        {
          link: "/logistics/crew-labels",
          title: "Crew labels",
          authenticated: true
        },
        {
          link: "/generate-start-order/marshalling-divisions",
          title: "Marshalling divisions",
          authenticated: true
        },
        {
          link: "/logistics/start-order-by-number-location",
          title: "Start order by number location",
          authenticated: true
        },
        {
          link: "/logistics/crew-draw-reports",
          title: "Crew draw reports",
          authenticated: true
        },
        {
          link: "/logistics/crew-on-the-day-contact",
          title: "On the day contact details",
          authenticated: true
        }
      ]
    },
    {
      parentItem: "Results",
      link: "/generate-results",
      authenticated: true,
      key: 2,
      items: [
        {
          link: "/generate-results",
          title: "Generate results",
          authenticated: true
        },
        {
          link: "/generate-results/crews",
          title: "All crews",
          authenticated: true
        },
        {
          link: "/generate-results/race-times",
          title: "Race times",
          authenticated: true
        },
        {
          link: "/generate-results/crew-management-dashboard",
          title: "Crew time management dashboard",
          authenticated: true
        },
        {
          link: "/generate-results/results",
          title: "Final results",
          authenticated: false
        },
        {
          link: "/generate-results/export",
          title: "Data exports",
          authenticated: true
        }
      ]
    },
    {
      parentItem: "Settings",
      link: "/settings/keys",
      authenticated: true,
      key: 3,
      items: [
        {
          link: "/settings/keys",
          title: "Add or change event key",
          authenticated: true
        },
        {
          link: "/settings/race-info",
          title: "Add racing offset",
          authenticated: true
        },
        {
          link: "/settings/register",
          title: "Register user",
          authenticated: true
        },
        {
          link: "/settings/info",
          title: "About this application",
          authenticated: true
        }
      ]
    }
  ]
}