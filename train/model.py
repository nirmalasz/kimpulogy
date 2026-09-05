from datetime import datetime, timedelta
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor

# 1. Load and combine your historical sales data
df_sales_1 = pd.read_csv('penjualan barang.csv')
df_sales_1['tanggal'] = pd.to_datetime(df_sales_1['tanggal'])
df_sales_1['nama_barang'] = df_sales_1['nama.barang'].str.strip().str.lower()
df1 = df_sales_1[['tanggal', 'nama_barang', 'kuantum']].rename(
    columns={'kuantum': 'qty'}
)

df_sales_2 = pd.read_csv('Penjualan Toko Sembako.csv', sep=';')
df_sales_2['Tanggal'] = pd.to_datetime(
    df_sales_2['Tanggal'], format='%d/%m/%Y'
)
df_sales_2['nama_barang'] = df_sales_2['Nama Barang'].str.strip().str.lower()
df2 = df_sales_2[['Tanggal', 'nama_barang', 'Kuantum']].rename(
    columns={'Tanggal': 'tanggal', 'Kuantum': 'qty'}
)

master_sales = pd.concat([df1, df2], ignore_index=True)

# Map common variations to a unified name to prevent duplicate columns/keys
name_mapping = {
    'migor': 'minyak goreng',
    'minyak goreng': 'minyak goreng',
    'beras': 'beras',
}
master_sales['nama_barang'] = master_sales['nama_barang'].replace(name_mapping)

# Aggregate daily sales per item
daily = (
    master_sales.groupby(['tanggal', 'nama_barang'])['qty']
    .sum()
    .reset_index()
)

# 2. Build Lag Features for ML
predictions_output = {}

for item in daily['nama_barang'].unique():
  item_df = daily[daily['nama_barang'] == item].sort_values('tanggal').copy()
  item_df.set_index('tanggal', inplace=True)
  item_df = item_df.asfreq('D', fill_value=0)

  # Create lag features
  item_df['lag_1'] = item_df['qty'].shift(1)
  item_df['lag_7'] = item_df['qty'].shift(7)
  item_df['rolling_mean_7'] = item_df['qty'].shift(1).rolling(window=7).mean()
  item_df['day_of_week'] = item_df.index.dayofweek

  # Drop rows with NaN caused by lagging
  item_df = item_df.dropna()

  if len(item_df) < 10:
    continue  # Skip items with too little data

  X = item_df[['lag_1', 'lag_7', 'rolling_mean_7', 'day_of_week']]
  y = item_df['qty']

  # 3. Train Random Forest Regressor
  model = RandomForestRegressor(n_estimators=100, random_state=42)
  model.fit(X, y)

  # Predict for the next day (using a DataFrame with column names to silence warnings)
  last_row = item_df.iloc[-1]
  next_features = pd.DataFrame(
      [[
          last_row['qty'],  # lag_1 becomes last known qty
          last_row['lag_1'],  # shift lag
          item_df['qty'].tail(7).mean(),  # recent rolling mean
          (datetime.now() + timedelta(days=1)).weekday(),
      ]],
      columns=['lag_1', 'lag_7', 'rolling_mean_7', 'day_of_week'],
  )

  predicted_qty = model.predict(next_features)[0]
  predictions_output[item] = round(max(0, predicted_qty), 2)

print('ML Predicted Sales Demand for Tomorrow:', predictions_output)