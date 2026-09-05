import HeroSection from "../components/HeroSection";
import PlumberSearch from "../components/PlumberSearch";
import ServicesSection from "../components/ServicesSection";
import WhyChooseUs from "../components/WhyChooseUs";
import Testimonials from "../components/Testimonials";
import { useSEO } from "../hooks/useSEO";
import { useStructuredData } from "../hooks/useStructuredData";

function Home() {
  useSEO({
    title: 'Book a Trusted Plumber Near You',
    description: 'PlumbPro connects you with verified, available plumbers near you in Nepal. Search by location, compare real reviews, and book in minutes.',
    path: '/',
  });
  useStructuredData();
  return <main><HeroSection /><PlumberSearch /><ServicesSection /><WhyChooseUs /><Testimonials /></main>;
}
export default Home;
