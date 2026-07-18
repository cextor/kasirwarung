<?php

namespace App\Models;

use CodeIgniter\Model;

class SaleModel extends Model
{
    protected $table            = 'sales';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = false;
    protected $returnType       = 'array';
    protected $protectFields    = true;
    protected $allowedFields    = [
        'id', 'invoice_number', 'timestamp', 'total_amount', 
        'cash_paid', 'change_due', 'payment_method'
    ];

    // Validation
    protected $validationRules      = [
        'id'             => 'required|max_length[50]',
        'invoice_number' => 'required|max_length[50]',
        'total_amount'   => 'required|numeric',
        'cash_paid'      => 'required|numeric',
        'change_due'     => 'required|numeric',
        'payment_method' => 'required|max_length[50]',
    ];
    protected $validationMessages   = [];
    protected $skipValidation       = false;
    protected $cleanValidationRules = true;
}
