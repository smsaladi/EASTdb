"""
"""

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy_repr import PrettyRepresentableBase

import numpy as np

db = SQLAlchemy(model_class=PrettyRepresentableBase)

# class Uniref50(db.Model):
#     id              = db.Column(db.String, primary_key=True)
#     coords_3d         = db.Column(Cube(3))
#     coords_8d         = db.Column(Cube(8))

