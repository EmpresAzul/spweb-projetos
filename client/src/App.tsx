import { Route, Switch } from "wouter";
import Home from "./pages/Home";
import Legal from "./pages/Legal";
import ThankYou from "./pages/ThankYou";
import Admin from "./pages/Admin";
import CookieBanner from "./components/CookieBanner";
function NotFound() { return <main className="wrap legal-wrap"><h1 className="headline">Página não encontrada.</h1><a className="back-link" href="/">Voltar ao site</a></main>; }
export default function App() {
 return <><Switch><Route path="/" component={Home} /><Route path="/politica-de-privacidade"><Legal type="privacy" /></Route><Route path="/termos-de-uso"><Legal type="terms" /></Route><Route path="/politica-de-cookies"><Legal type="cookies" /></Route><Route path="/obrigado" component={ThankYou} /><Route path="/admgerencia" component={Admin} /><Route component={NotFound} /></Switch><CookieBanner /></>;
}
