from sklearn.base import TransformerMixin, BaseEstimator

class ItemSelector(TransformerMixin, BaseEstimator):
    def __init__(self, key):
        self.key = key

    def fit(self, x, y=None):
        return self

    def transform(self, data_dict):
        return data_dict[self.key]
