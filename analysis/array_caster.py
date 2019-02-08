import numpy as np
from sklearn.base import TransformerMixin, BaseEstimator


class ArrayCaster(BaseEstimator, TransformerMixin):
    def fit(self, x, y=None):
        return self

    def transform(self, data):
        return np.transpose(np.matrix(data))