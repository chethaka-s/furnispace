'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Custom Navbar */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gray-800 h-30 text-white py-4 sticky top-0 z-50 shadow-lg"
      >
        <div className="container mx-auto flex justify-between items-center px-4">
          <motion.div 
            className="flex items-center"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <img src="https://res.cloudinary.com/dbjicmnmj/image/upload/v1746723751/logo_cut_nayfsi.png" alt="Logo" className="h-20 w-auto mr-2" />
          </motion.div>
          <div className="flex items-center space-x-6">
            {['Home', 'About', 'Contact Us'].map((item, index) => (
              <motion.a
                key={item}
                href={item === 'About' ? './about' : item === 'Contact Us' ? './contact' : '#'}
                className="text-white hover:text-gray-300 text-lg"
                whileHover={{ scale: 1.1 }}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {item}
              </motion.a>
            ))}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                variant="ghost" 
                onClick={() => router.push('/login')}
                className="text-white hover:text-gray-300"
              >
                Log In
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.div 
        className="relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <img
          src="https://images.unsplash.com/photo-1593696140826-c58b021acf8b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Modern Living Room"
          className="w-full h-[800px] object-cover brightness-75"
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center w-full max-w-4xl px-4"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <div className="bg-black/60 p-8 rounded-[30px] backdrop-blur-sm">
            <motion.h1 
              className="text-6xl font-bold text-white mb-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              DESIGN YOUR SPACE FOR LIVING
            </motion.h1>
            <motion.p 
              className="text-2xl text-white"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1 }}
            >
              Transform your home into a haven of comfort and style. Discover innovative interior solutions tailored to your lifestyle.
            </motion.p>
          </div>
        </motion.div>
      </motion.div>
      
      {/* Design Your Interior Section */}
      <motion.div 
        className="container mx-auto py-24 px-4"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.img
            src="https://images.unsplash.com/photo-1680503397090-0483be73406f?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Interior Design"
            className="w-full h-[500px] object-cover rounded-2xl shadow-2xl"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          />
          <motion.div 
            className="bg-white/90 p-8 rounded-[30px] shadow-xl"
            initial={{ x: 100, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <h1 className="text-5xl font-bold text-gray-800 mb-6">DESIGN YOUR INTERIOR As Your Dream...</h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Bring your imagination to life with Furnispace. Create, visualize, and customize your interior space in stunning 2D and 3D formats. Whether you're styling a modern kitchen, a cozy bedroom, or an elegant office, Furnispace gives you the tools to experiment with layouts, colors, furniture, and decor until your vision becomes a reality.
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Services Section */}
      <motion.div 
        className="bg-gray-50 py-24"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  {
                    icon: "https://res.cloudinary.com/dwejq5ajx/image/upload/v1746618043/icon2_mka5gy.png",
                    title: "Home Interior",
                    description: "Transform your living space into a perfect blend of comfort and style. With Furnispace, you can visualize and customize every room to match your personality and lifestyle."
                  },
                  {
                    icon: "https://res.cloudinary.com/dwejq5ajx/image/upload/v1746618043/icon3_taij6a.png",
                    title: "3D Designing",
                    description: "Step into your future space with immersive 3D visuals. Explore detailed interiors with realistic textures, lighting, and furniture placement."
                  },
                  {
                    icon: "https://res.cloudinary.com/dwejq5ajx/image/upload/v1746618043/icon4_sot7gx.png",
                    title: "2D Designing",
                    description: "Plan with precision using our 2D designing tools. Create floor plans, furniture layouts, and space arrangements with easy drag-and-drop features."
                  },
                  {
                    icon: "https://res.cloudinary.com/dwejq5ajx/image/upload/v1746618043/icon1_cedef6.png",
                    title: "Architecture",
                    description: "Build from the ground up with expert architectural design support. Blend functionality with aesthetics for both residential and commercial spaces."
                  }
                ].map((service, index) => (
                  <motion.div
                    key={service.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.2 }}
                  >
                    <Card className="h-full hover:shadow-xl transition-shadow duration-300">
                      <CardHeader className="flex justify-center">
                        <motion.img
                          src={service.icon}
                          alt={`${service.title} Icon`}
                          className="w-16 h-16"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                        />
                      </CardHeader>
                      <CardContent className="text-center">
                        <h2 className="text-2xl font-bold mb-4">{service.title}</h2>
                        <p className="text-gray-600">{service.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
            <motion.div 
              className="flex flex-col justify-center space-y-8"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl font-bold">SERVICES PROVIDED BY US</h2>
              <motion.img
                src="https://res.cloudinary.com/dwejq5ajx/image/upload/v1746619138/himh_kwwljs.jpg"
                alt="Services Overview"
                className="w-full rounded-2xl shadow-2xl"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* How We Work Section */}
      <motion.div 
        className="container mx-auto py-24 px-4"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <motion.h2 
          className="text-5xl font-bold text-center mb-16"
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
        >
          HOW WE WORK
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "01 Statement of the problem",
              content: "We begin by understanding your space and design goals. Whether it's a home, office, or commercial area, you tell us what needs to change or improve.",
              dark: true
            },
            {
              title: "02 Project presentation",
              content: "Our team develops detailed project presentations that outline the proposed design solutions, including layouts, materials, and timelines.",
              dark: false
            },
            {
              title: "03 Development of renderings",
              content: "We create photorealistic 3D renderings that bring your project to life, allowing you to visualize the final result before implementation begins.",
              dark: true
            }
          ].map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
            >
              <Card className={`h-full ${step.dark ? 'bg-gray-800 text-white' : 'bg-white'} hover:shadow-xl transition-shadow duration-300`}>
                <CardHeader>
                  <CardTitle className="text-2xl">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg leading-relaxed">{step.content}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <img src="https://res.cloudinary.com/dbjicmnmj/image/upload/v1746598034/logo2_wl2var.png" alt="Logo" className="h-30 w-50 mb-4" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-xl font-bold mb-6">Service</h3>
              <ul className="space-y-3">
                {['Floor Planning', 'Interior design', '2D designing', '3D designing'].map((item) => (
                  <motion.li 
                    key={item}
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <a href="#" className="hover:text-gray-300 transition-colors duration-200">
                      {item}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </footer>
    </div>
  );
}