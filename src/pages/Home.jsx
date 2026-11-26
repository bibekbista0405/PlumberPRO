import HeroSection from "../components/HeroSection";
import PlumberSearch from "../components/PlumberSearch";
import ServicesSection from "../components/ServicesSection";
import WhyChooseUs from "../components/WhyChooseUs";
import Testimonials from "../components/Testimonials";
import MarqueeStrip from "../components/MarqueeStrip";
import HowItWorks from "../components/HowItWorks";
import StatsBand from "../components/StatsBand";
import PlumberCTA from "../components/PlumberCTA";
import FAQ from "../components/FAQ";
import { useSEO } from "../hooks/useSEO";
import { useStructuredData } from "../hooks/useStructuredData";

function Home() {
  useSEO({
    title: 'Book a Trusted Plumber Near You',
    description: 'PlumbPro connects you with verified, available plumbers near you in Nepal. Search by location, compare real reviews, and book in minutes.',
    path: '/',
  });
  useStructuredData();
  return <main><HeroSection /><MarqueeStrip /><PlumberSearch /><ServicesSection /><HowItWorks /><StatsBand /><WhyChooseUs /><Testimonials /><PlumberCTA /><FAQ /></main>;
}
export default Home;
