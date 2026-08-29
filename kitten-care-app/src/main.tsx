import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { LocalStorageRepository } from './data/LocalStorageRepository';
import './styles.css';

const repository = new LocalStorageRepository();
createRoot(document.getElementById('root')!).render(<StrictMode><App repository={repository} /></StrictMode>);
