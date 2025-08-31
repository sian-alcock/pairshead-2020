import { MenuProps } from "../../molecules/Menu/Menu";

export const menuProps: MenuProps = {
  menuItems: [
    {
      key: 3,
      parentItem: "Pre-race / setup",
      link: "/logistics",
      authenticated: true,
      items: [
        {
          link: "/logistics/crew-labels",
          title: "Crew labels",
          authenticated: true
        },
        {
          link: "/marshalling-divisions",
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
      key: 4,
      items: [
        {
          link: "/race-times",
          title: "Race times",
          authenticated: true
        },
        {
          link: "/crew-management-dashboard",
          title: "Crew time management dashboard",
          authenticated: true
        },
        {
          link: "/results",
          title: "Final results",
          authenticated: false
        },
        {
          link: "/export",
          title: "Data exports",
          authenticated: true
        }
      ]
    },
    {
      parentItem: "Settings",
      link: "/settings/keys",
      authenticated: true,
      key: 5,
      items: [
        {
          link: "/settings/keys",
          title: "Add or change event key",
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
};
