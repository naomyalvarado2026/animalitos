import { useLocation, useOutlet } from 'react-router-dom';

export function RouteTransition() {
  const location = useLocation();
  const outlet = useOutlet();

  return <div key={location.pathname} className="route-page-transition min-w-0">{outlet}</div>;
}
