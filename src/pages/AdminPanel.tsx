import { useAdminStore } from '../store/adminStore';
import PropertySettingsForm from '../components/admin/PropertySettings';
import CardTypesAdmin from '../components/admin/CardTypes';
import ColorsAdmin from '../components/admin/Colors';
import EmployeesAdmin from '../components/admin/Employees';
import PackagingRulesAdmin from '../components/admin/PackagingRules';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';

export default function AdminPanel() {
  const {
    store,
    saveSettings,
    savePackagingRules,
    addCardType,
    updateCardType,
    toggleCardTypeActive,
    addColor,
    updateColor,
    toggleColorActive,
    addEmployee,
    updateEmployee,
    toggleEmployeeActive,
  } = useAdminStore();

  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Navigate to="settings" replace />} />
        <Route
          path="settings"
          element={
            <PropertySettingsForm settings={store.settings} onSave={saveSettings} />
          }
        />
        <Route
          path="card-types"
          element={
            <CardTypesAdmin
              cardTypes={store.cardTypes}
              onAdd={addCardType}
              onUpdate={updateCardType}
              onToggleActive={toggleCardTypeActive}
            />
          }
        />
        <Route
          path="colors"
          element={
            <ColorsAdmin
              colors={store.colors}
              cardTypes={store.cardTypes}
              onAdd={addColor}
              onUpdate={updateColor}
              onToggleActive={toggleColorActive}
            />
          }
        />
        <Route
          path="employees"
          element={
            <EmployeesAdmin
              employees={store.employees}
              onAdd={addEmployee}
              onUpdate={updateEmployee}
              onToggleActive={toggleEmployeeActive}
            />
          }
        />
        <Route
          path="packaging"
          element={
            <PackagingRulesAdmin
              rules={store.packagingRules}
              onSave={savePackagingRules}
            />
          }
        />
      </Route>
    </Routes>
  );
}
