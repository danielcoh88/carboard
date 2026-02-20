import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CarProvider } from './store/CarContext';
import Header from './components/Header';
import CarList from './components/CarList';
import CarForm from './components/CarForm';
import CarDetail from './components/CarDetail';
import ImportModal from './components/ImportModal';

export default function App() {
  return (
    <BrowserRouter>
      <CarProvider>
        <div className="app">
          <Header />
          <main className="main">
            <Routes>
              <Route path="/" element={<CarList />} />
              <Route path="/car/new" element={<CarForm />} />
              <Route path="/car/:id" element={<CarDetail />} />
              <Route path="/car/:id/edit" element={<CarForm />} />
              <Route path="/import" element={<ImportModal />} />
            </Routes>
          </main>
        </div>
      </CarProvider>
    </BrowserRouter>
  );
}
