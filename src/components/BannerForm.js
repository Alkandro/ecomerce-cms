import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { storage, db } from '../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, doc, getDocs, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';


const BannerForm = () => {
    const [banners, setBanners] = useState([]);
    const [products, setProducts] = useState([]);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        fetchBanners();
        fetchProducts();
    }, []);

   

    const fetchBanners = async () => {
        try {
            const bannersCollection = collection(db, 'banners');
            const snapshot = await getDocs(bannersCollection);
            const bannerList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            bannerList.sort((a, b) => (a.order || 0) - (b.order || 0));
            setBanners(bannerList);
        } catch (error) {
            console.error("Error al cargar los banners:", error);
        }
    };

    const fetchProducts = async () => {
        try {
            const productsCollection = collection(db, 'products');
            const snapshot = await getDocs(productsCollection);
            const productList = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
            setProducts(productList);
        } catch (error) {
            console.error("Error al cargar los productos:", error);
        }
    };

    const onDrop = useCallback(async (acceptedFiles) => {
        const file = acceptedFiles[0];
        setIsUploading(true);
        const storageRef = ref(storage, `banners/${file.name}-${Date.now()}`);
        try {
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            const newBannerRef = doc(collection(db, 'banners'));
            await setDoc(newBannerRef, { imageUrl: downloadURL, productId: null, order: banners.length, title: '', startDate: null, endDate: null });
            fetchBanners();
        } catch (error) {
            console.error("Error al subir la imagen:", error);
        } finally {
            setIsUploading(false);
        }
    }, [banners.length]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: 'image/*' });

    const handleInputChange = (bannerId, name, value) => {
        const updatedBanners = banners.map(banner =>
            banner.id === bannerId ? { ...banner, [name]: value } : banner
        );
        setBanners(updatedBanners);
    };

    const handleProductChange = (bannerId, productId) => {
        handleInputChange(bannerId, 'productId', productId);
    };

    const handleImageChange = async (bannerId, newFile) => {
        setIsUploading(true);
        const storageRef = ref(storage, `banners/${newFile.name}-${Date.now()}`);
        try {
            const snapshot = await uploadBytes(storageRef, newFile); // <-- CORRECCIÓN AQUÍ
            const downloadURL = await getDownloadURL(snapshot.ref);
            const bannerRef = doc(db, 'banners', bannerId);
            await setDoc(bannerRef, { imageUrl: downloadURL }, { merge: true });
            fetchBanners();
        } catch (error) {
            console.error("Error al cambiar la imagen del banner:", error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveBanner = async (bannerId) => {
        try {
            const bannerRef = doc(db, 'banners', bannerId);
            await deleteDoc(bannerRef);
            fetchBanners();
        } catch (error) {
            console.error("Error al eliminar el banner:", error);
        }
    };

    const onDragEnd = (result) => {
        if (!result.destination) {
            return;
        }

        const reorderedBanners = Array.from(banners);
        const [movedBanner] = reorderedBanners.splice(result.source.index, 1);
        reorderedBanners.splice(result.destination.index, 0, movedBanner);

        setBanners(reorderedBanners.map((banner, index) => ({ ...banner, order: index })));
    };

    const handleSaveChanges = async () => {
        const batch = writeBatch(db);
        banners.forEach(banner => {
            const bannerRef = doc(db, 'banners', banner.id);
            batch.update(bannerRef, { title: banner.title, productId: banner.productId, startDate: banner.startDate, endDate: banner.endDate, order: banner.order });
        });

        try {
            await batch.commit();
            alert('Cambios guardados exitosamente!');
        } catch (error) {
            console.error("Error al guardar los cambios:", error);
        }
    };

    return (
        <div>
            <h2>Gestión de Banners</h2>

            <div {...getRootProps()} style={dropzoneStyle}>
                <input {...getInputProps()} />
                {isDragActive ? (
                    <p>Suelta aquí la nueva imagen del banner...</p>
                ) : (
                    <p>Arrastra y suelta una nueva imagen aquí, o haz clic para seleccionar un archivo.</p>
                )}
                {isUploading && <p>Subiendo imagen...</p>}
            </div>

            <h3>Banners Existentes</h3>
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="bannersList">
                    {(provided) => (
                        <ul {...provided.droppableProps} ref={provided.innerRef} style={listStyle}>
                            {banners.map((banner, index) => (
                                <Draggable key={banner.id} draggableId={banner.id} index={index}>
                                    {(provided) => (
                                        <li
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            style={getItemStyle(provided.draggableProps.style)}
                                        >
                                            <img src={banner.imageUrl} alt="Banner" style={imageStyle} />
                                            <div>
                                                <label>
                                                    Título:
                                                    <input
                                                        type="text"
                                                        value={banner.title || ''}
                                                        onChange={(e) => handleInputChange(banner.id, 'title', e.target.value)}
                                                    />
                                                </label>
                                                <label>
                                                    Producto Asociado:
                                                    <select
                                                        value={banner.productId || ''}
                                                        onChange={(e) => handleProductChange(banner.id, e.target.value)}
                                                    >
                                                        <option value="">Ninguno</option>
                                                        {products.map(product => (
                                                            <option key={product.id} value={product.id}>{product.name}</option>
                                                        ))}
                                                    </select>
                                                </label>
                                                <label>
                                                    Fecha de Inicio:
                                                    <input
                                                        type="date"
                                                        value={banner.startDate || ''}
                                                        onChange={(e) => handleInputChange(banner.id, 'startDate', e.target.value)}
                                                    />
                                                </label>
                                                <label>
                                                    Fecha de Fin:
                                                    <input
                                                        type="date"
                                                        value={banner.endDate || ''}
                                                        onChange={(e) => handleInputChange(banner.id, 'endDate', e.target.value)}
                                                    />
                                                </label>
                                                <label>
                                                    Cambiar Imagen:
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            if (e.target.files && e.target.files[0]) {
                                                                handleImageChange(banner.id, e.target.files[0]);
                                                            }
                                                        }}
                                                    />
                                                </label>
                                                <button onClick={() => handleRemoveBanner(banner.id)}>Eliminar</button>
                                            </div>
                                        </li>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </ul>
                    )}
                </Droppable>
            </DragDropContext>

            <button onClick={handleSaveChanges}>Guardar Cambios</button>
        </div>
    );
};

const dropzoneStyle = {
    border: '2px dashed #ccc',
    borderRadius: '4px',
    padding: '20px',
    textAlign: 'center',
    cursor: 'pointer',
    marginBottom: '20px',
};

const listStyle = {
    listStyleType: 'none',
    padding: 0,
};

const getItemStyle = (style) => ({
    display: 'flex',
    border: '1px solid #ddd',
    marginBottom: '8px',
    padding: '10px',
    backgroundColor: 'white',
    ...style,
});

const imageStyle = {
    maxWidth: '150px',
    maxHeight: '100px',
    marginRight: '15px',
    objectFit: 'contain',
};

export default BannerForm;